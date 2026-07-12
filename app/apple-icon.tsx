import {ImageResponse} from "next/og";
export const size={width:1024,height:1024};
export const contentType="image/png";
export default function AppleIcon(){return new ImageResponse(<div style={{width:"100%",height:"100%",display:"flex",position:"relative",alignItems:"center",justifyContent:"center",background:"#121018",color:"white",fontSize:570,fontWeight:850,fontFamily:"Arial",letterSpacing:-45}}>F<div style={{position:"absolute",left:164,right:164,top:86,height:164,borderRadius:"90px 90px 26px 26px",background:"linear-gradient(135deg,#8b73ff,#4d2fd0)"}}/></div>,size)}
