// One-shot in-memory handoff to the existing Home feed after post creation.
// Avoid nested navigator route parameters or root deep links on Android.
let pendingPublishedId="";

export function markPublishedPostForHome(postId:string){
 pendingPublishedId=postId;
}

export function takePublishedPostForHome(){
 const postId=pendingPublishedId;
 pendingPublishedId="";
 return postId;
}
