import {memo} from "react";
import Svg,{Path,Circle} from "react-native-svg";

/**
 * Traced directly from the user's two-overlapping-chat-bubbles reference.
 * One vector is shared by the bottom Messages tab and visitor's message action.
 * Filled state retains the three transparent cutouts from the supplied artwork.
 * Outline state uses the same overlapping-bubble silhouette and visible dots.
 */
function Icon({size=25,color,filled=true}:{size?:number;color:string;filled?:boolean}){
 if(!filled)return <Svg width={size} height={size} viewBox="0 0 100 100" fill="none" accessible={false}>
  <Path d="M24 14.5C26.5 6.5 32 1.5 42 1.5H84C93 1.5 99 9 99 18V49C99 57 95 62 85 65"
   fill="none" stroke={color} strokeWidth={6.3} strokeLinecap="round" strokeLinejoin="round"/>
  <Path d="M17 21H63C73 21 79 27 79 37V68C79 78 73 85 62 85H47L28 95C22 98 20 94 20 86V85H17C7 85 1.5 78 1.5 68V38C1.5 27 7 21 17 21Z"
   fill="none" stroke={color} strokeWidth={6.3} strokeLinecap="round" strokeLinejoin="round"/>
  <Circle cx={23.5} cy={53} r={5.2} fill={color}/>
  <Circle cx={40} cy={53} r={5.2} fill={color}/>
  <Circle cx={56.5} cy={53} r={5.2} fill={color}/>
 </Svg>;
 return <Svg width={size} height={size} viewBox="0 0 100 100" fill="none" accessible={false}>
  <Path d="M 26.15 7.62 L 24.15 10.85 L 23.00 14.46 L 64.54 14.46 L 67.85 14.92 L 71.38 15.92 L 74.00 17.08 L 76.46 18.62 L 79.31 21.15 L 81.38 23.85 L 83.08 27.08 L 84.54 31.92 L 85.15 36.85 L 85.23 65.23 L 87.77 64.62 L 91.00 63.08 L 93.62 61.08 L 95.69 58.69 L 97.77 54.85 L 98.46 52.38 L 98.77 49.85 L 98.77 17.15 L 98.15 13.23 L 96.69 9.77 L 94.54 6.77 L 91.85 4.38 L 90.23 3.38 L 87.62 2.23 L 84.00 1.46 L 37.38 1.46 L 34.77 1.92 L 31.31 3.31 L 28.31 5.38 Z" fill={color}/>
  <Path d="M 5.15 27.00 L 3.69 29.08 L 2.77 30.92 L 2.00 33.15 L 1.54 35.69 L 1.46 68.38 L 1.62 71.62 L 2.00 73.85 L 2.62 75.92 L 3.85 78.46 L 5.15 80.23 L 7.54 82.31 L 10.15 83.69 L 12.23 84.38 L 15.62 85.00 L 18.46 85.08 L 19.23 85.54 L 19.54 86.23 L 19.54 89.31 L 19.92 91.46 L 20.77 93.23 L 21.85 94.31 L 24.15 95.23 L 25.92 95.31 L 28.31 94.92 L 30.69 94.15 L 47.23 85.15 L 62.00 85.08 L 65.15 84.77 L 68.62 83.69 L 71.85 81.85 L 74.31 79.62 L 75.62 78.00 L 76.69 76.23 L 77.69 73.92 L 78.54 69.77 L 78.54 36.23 L 77.77 32.23 L 76.46 29.31 L 74.62 26.69 L 71.77 24.08 L 69.54 22.69 L 67.77 21.92 L 65.69 21.31 L 63.00 20.92 L 17.08 20.92 L 13.77 21.46 L 10.08 22.92 L 7.46 24.69 Z M 55.69 47.31 L 57.62 47.38 L 59.62 48.23 L 61.38 50.08 L 62.15 52.15 L 62.00 54.69 L 61.00 56.62 L 59.23 58.15 L 57.08 58.85 L 55.23 58.77 L 52.85 57.62 L 51.46 56.08 L 50.69 54.00 L 50.77 51.77 L 51.77 49.62 L 53.62 48.00 Z M 39.31 47.31 L 41.15 47.38 L 43.23 48.23 L 44.85 49.85 L 45.54 51.23 L 45.77 52.31 L 45.69 54.31 L 44.77 56.38 L 42.92 58.08 L 40.69 58.85 L 38.54 58.69 L 36.54 57.69 L 35.00 56.00 L 34.23 53.69 L 34.46 51.38 L 35.54 49.38 L 37.31 47.92 Z M 22.08 47.46 L 24.31 47.31 L 26.31 47.92 L 28.08 49.38 L 29.23 51.62 L 29.38 53.69 L 28.62 56.00 L 27.00 57.77 L 25.08 58.69 L 22.92 58.85 L 20.69 58.08 L 19.08 56.69 L 18.08 54.85 L 17.85 52.31 L 18.54 50.23 L 20.00 48.54 Z" fill={color} fillRule="evenodd"/>
 </Svg>;
}
export const JobeenMessageIcon=memo(Icon);
