package expo.modules.jobeenprivatefiles

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.system.Os
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.typedarray.Uint8Array
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.security.KeyStore
import java.util.UUID
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/**
 * Candidate Android-only bridge, not yet connected to draft/editor screens.
 * No arbitrary paths, plaintext files, exported keys or generic delete API.
 * The JS vault checks authenticated account/session before and after calls.
 * This is not a security boundary against arbitrary code in the app process.
 */
class JobeenPrivateFilesModule : Module() {
  companion object {
    private const val LIMIT = 2 * 1024 * 1024
    private const val NONCE = 12
    private const val TAG = 16
    private val ID = Regex("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")
    private val keyLock = Any()
  }

  override fun definition() = ModuleDefinition {
    Name("JobeenPrivateFiles")
    Function("randomId") { UUID.randomUUID().toString() }
    // TypedArray access is synchronous on the JS runtime, following SDK 54
    // CryptoModule. The deliberately small pilot limit bounds blocking/memory.
    Function("seal") { owner: String, input: Uint8Array, aad: String, output: Uint8Array ->
      safe { seal(owner, input, aad, output) }
    }
    Function("open") { owner: String, input: Uint8Array, aad: String, output: Uint8Array ->
      safe { open(owner, input, aad, output) }
    }
    Function("createCiphertext") { owner: String, id: String, input: Uint8Array ->
      safe { createCiphertext(owner, id, input) }
    }
    Function("ciphertextSize") { owner: String, id: String ->
      safe { ciphertextSize(owner, id) }
    }
    Function("readCiphertext") { owner: String, id: String, output: Uint8Array ->
      safe { readCiphertext(owner, id, output) }
    }
  }

  private fun <T> safe(block: () -> T): T {
    try { return block() } catch (_: Exception) {
      // Do not serialize keys, account identifiers, paths or provider errors.
      throw IllegalStateException("Private file operation unavailable")
    }
  }
  private fun validId(value: String): String {
    require(ID.matches(value))
    return value
  }
  private fun key(owner: String, create: Boolean): SecretKey = synchronized(keyLock) {
    val alias = "jobeen.private.file.v1." + validId(owner)
    val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
    val existing = store.getKey(alias, null)
    if (existing != null) return@synchronized existing as SecretKey
    // Decryption with a lost key MUST fail, not generate a replacement.
    check(create && !store.containsAlias(alias))
    val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
    generator.init(KeyGenParameterSpec.Builder(alias,
      KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
      .setKeySize(256)
      .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
      .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
      .setRandomizedEncryptionRequired(true)
      .setUserAuthenticationRequired(false)
      .build())
    generator.generateKey()
  }
  private fun aadBytes(aad: String): ByteArray {
    require(aad.length in 1..512)
    return aad.toByteArray(Charsets.UTF_8)
  }
  private fun copy(input: Uint8Array): ByteArray =
    ByteArray(input.byteLength).also { input.read(it, input.byteOffset, input.byteLength) }
  private fun seal(owner: String, input: Uint8Array, aad: String, output: Uint8Array) {
    require(input.byteLength in 1..LIMIT && output.byteLength == input.byteLength + NONCE + TAG)
    val cipher = Cipher.getInstance("AES/GCM/NoPadding")
    cipher.init(Cipher.ENCRYPT_MODE, key(owner, true))
    cipher.updateAAD(aadBytes(aad))
    val nonce = cipher.iv
    require(nonce.size == NONCE)
    val plain = copy(input)
    try {
      val sealed = cipher.doFinal(plain)
      require(sealed.size == input.byteLength + TAG)
      val envelope = nonce + sealed
      output.write(envelope, output.byteOffset, output.byteLength)
    } finally { plain.fill(0) }
  }
  private fun open(owner: String, input: Uint8Array, aad: String, output: Uint8Array) {
    require(output.byteLength in 1..LIMIT && input.byteLength == output.byteLength + NONCE + TAG)
    val envelope = copy(input)
    val cipher = Cipher.getInstance("AES/GCM/NoPadding")
    cipher.init(Cipher.DECRYPT_MODE, key(owner, false), GCMParameterSpec(128, envelope, 0, NONCE))
    cipher.updateAAD(aadBytes(aad))
    // No plaintext output before doFinal authenticates the tag.
    val plain = cipher.doFinal(envelope, NONCE, envelope.size - NONCE)
    try {
      require(plain.size == output.byteLength)
      output.write(plain, output.byteOffset, output.byteLength)
    } finally { plain.fill(0) }
  }

  private fun objectFile(owner: String, id: String): File {
    val context = checkNotNull(appContext.reactContext)
    // noBackupFilesDir avoids Android Auto Backup and external media storage.
    val root = File(context.noBackupFilesDir, "jobeen-private-files-v1")
    val directory = File(root, validId(owner))
    return File(directory, validId(id) + ".sealed")
  }
  private fun createCiphertext(owner: String, id: String, input: Uint8Array) {
    require(input.byteLength in (NONCE + TAG + 1)..(LIMIT + NONCE + TAG))
    val destination = objectFile(owner, id)
    val parent = checkNotNull(destination.parentFile)
    check(parent.isDirectory || parent.mkdirs() || parent.isDirectory)
    check(!destination.exists())
    // A same-directory hard link publishes only complete ciphertext, without
    // replacing an existing destination even if two operations race.
    val staged = File.createTempFile("sealed-", ".tmp", parent)
    try {
      FileOutputStream(staged).use { stream -> stream.write(copy(input)); stream.fd.sync() }
      Os.link(staged.absolutePath, destination.absolutePath)
    } finally {
      // Delete only the staging file this operation created, never final files.
      staged.delete()
    }
  }
  private fun ciphertextSize(owner: String, id: String): Int {
    val file = objectFile(owner, id)
    check(file.isFile)
    val n = file.length()
    require(n >= NONCE + TAG + 1L && n <= LIMIT + NONCE + TAG.toLong())
    return n.toInt()
  }
  private fun readCiphertext(owner: String, id: String, output: Uint8Array) {
    val n = ciphertextSize(owner, id)
    require(output.byteLength == n)
    val bytes = ByteArray(n)
    FileInputStream(objectFile(owner, id)).use { stream ->
      var offset = 0
      while (offset < n) {
        val read = stream.read(bytes, offset, n - offset)
        check(read > 0)
        offset += read
      }
      check(stream.read() == -1)
    }
    output.write(bytes, output.byteOffset, output.byteLength)
  }
}
