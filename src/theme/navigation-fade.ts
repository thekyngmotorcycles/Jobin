/** Preserve the original fade above the icon row; only increase opacity within it.
 * Geometry matches the pre-hybrid-feed NavigationFade, including safe area.
 */
export function bottomNavigationFade(rowHeight:number,bottomInset:number,originalOpacity:number,profileOpaque=false){
 const fringe=100;
 const height=rowHeight+bottomInset+fringe;
 const rowStart=fringe/height;
 const center=(fringe+rowHeight/2)/height;
 const softStart=center*.4;
 const softOpacity=.035;
 // Same linear interpolation as the original gradient at the top of the row.
 const rowStartOpacity=softOpacity+(originalOpacity-softOpacity)*(rowStart-softStart)/(center-softStart);
 return {height,stops:[
  {offset:0,opacity:0},
  {offset:softStart,opacity:softOpacity},
  {offset:rowStart,opacity:profileOpaque?1:rowStartOpacity},
  {offset:center,opacity:1},
  {offset:1,opacity:1},
 ]};
}
