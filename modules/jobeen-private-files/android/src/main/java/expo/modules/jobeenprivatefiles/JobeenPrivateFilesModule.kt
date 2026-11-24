package expo.modules.jobeenprivatefiles

import android.net.Uri
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.system.Os
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.typedarray.Uint8Array
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.OutputStream
import java.security.KeyStore
import java.util.UUID
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/**
 * Candidate Android-only bridge for the draft/editor screens.
 * No plaintext staging, exported keys or generic delete API.
 * The JS vault checks authenticated account/session before and after calls.
 * This is not a security boundary against arbitrary code in the app process.
 */
class JobeenPrivateFilesModule : Module() {
  companion object {
    // Input photographs may be much larger than the final encrypted attachment.
    private const val PHOTO_SOURCE_LIMIT = 32 * 1024 * 1024
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
    Function("readPicked") { value: String, output: Uint8Array, normalizePhoto: Boolean ->
      safe { readPicked(value, output, normalizePhoto) }
    }
    Function("discardImagePickerCopy") { value: String ->
      safe { pickerCopy(Uri.parse(value))?.let { check(!it.exists() || it.delete()) }; Unit }
    }
  }

  // Expo SDK 54 generates UUID-named derivatives in cache/ImagePicker.
  // Never follow symlinks or unlink content-provider/gallery originals.
  private fun pickerCopy(uri: Uri): File? {
    if (uri.scheme != "file" || !uri.authority.isNullOrEmpty() || uri.query != null || uri.fragment != null) return null
    val context = checkNotNull(appContext.reactContext)
    val root = File(context.cacheDir.canonicalFile, "ImagePicker")
    val path = uri.path ?: return null
    if (path.split('/').any { it == "." || it == ".." }) return null
    val file = File(path)
    val target = File(root, file.name)
    if (root.canonicalFile != root || file.parentFile?.canonicalFile != root || file.canonicalFile != target) return null
    return target.takeIf { it.name.matches(Regex("[0-9a-f-]{36}\\.[A-Za-z0-9]{1,8}")) && ID.matches(it.name.substringBefore('.')) }
  }

  private fun readPicked(value: String, output: Uint8Array, normalize: Boolean): Int {
    require(output.byteLength == LIMIT)
    val uri = Uri.parse(value)
    // Only publication photos may exceed LIMIT before re-encoding. Evidence
    // documents keep the original bound and are never silently transformed.
    val maximum = if (normalize) PHOTO_SOURCE_LIMIT else LIMIT
    val picked = if (uri.scheme == "file") checkNotNull(pickerCopy(uri)) else null
    val capacity = if (picked != null) {
      val length = picked.length()
      if (length > maximum.toLong()) return -1
      require(length > 0)
      length.toInt()
    } else maximum
    val bytes = ByteArray(capacity)
    // A separate bounded destination prevents the encoder overwriting its input.
    val prepared = if (normalize) ByteArray(LIMIT) else bytes
    try {
      val stream = when (uri.scheme) {
        "file" -> FileInputStream(checkNotNull(picked))
        "content" -> checkNotNull(checkNotNull(appContext.reactContext).contentResolver.openInputStream(uri))
        else -> error("Unsupported selection")
      }
      return stream.use {
        var count = 0
        while (count < capacity) {
          val read = it.read(bytes, count, capacity - count)
          if (read == -1) break
          check(read > 0)
          count += read
        }
        // Reject oversize/truncated input, never publish a partial original.
        if (count == capacity && it.read() != -1) return@use -1
        check(count > 0)
        val written = if (normalize) normalizePhoto(bytes, count, prepared) else count
        if (written !in 1..LIMIT) return@use -1
        output.write(prepared, output.byteOffset, written)
        written
      }
    } finally {
      bytes.fill(0)
      if (normalize) prepared.fill(0)
    }
  }

  // The picker can copy GPS/EXIF even with exif:false. Re-encode shareable
  // photos in memory so publication never sends those original metadata.
  private fun normalizePhoto(source: ByteArray, count: Int, target: ByteArray): Int {
    val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeByteArray(source, 0, count, options)
    require(options.outWidth in 1..16384 && options.outHeight in 1..16384)
    require(options.outMimeType in setOf("image/jpeg", "image/png", "image/webp"))
    var sample = 1
    while (maxOf(options.outWidth, options.outHeight) > 1440 * sample) sample *= 2
    options.inJustDecodeBounds = false
    options.inSampleSize = sample
    val bitmap = checkNotNull(BitmapFactory.decodeByteArray(source, 0, count, options))
    try {
      // Retry within the same bounded in-memory destination, without a new
      // picker selection, temporary plaintext file, or larger encrypted limit.
      for (quality in intArrayOf(76, 64, 50)) {
        var written = 0
        var overflow = false
        val bounded = object : OutputStream() {
          override fun write(value: Int) {
            if (written == LIMIT) { overflow = true; return }
            target[written++] = value.toByte()
          }
          override fun write(buffer: ByteArray, offset: Int, length: Int) {
            require(offset >= 0 && length >= 0 && offset <= buffer.size - length)
            val available = LIMIT - written
            val accepted = minOf(length, available)
            buffer.copyInto(target, written, offset, offset + accepted)
            written += accepted
            if (accepted != length) overflow = true
          }
        }
        val compressed = bitmap.compress(Bitmap.CompressFormat.JPEG, quality, bounded)
        if (compressed && !overflow && written in 1..LIMIT) return written
      }
      return -1
    } finally { bitmap.recycle() }
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
