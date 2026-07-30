import {ImageResponse} from "next/og";

export const alt = "Science Studio interactive physics experiments for teachers";
export const size = {width: 1200, height: 630};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{width: "100%", height: "100%", display: "flex", color: "#eceee8", background: "#1d1e1b", fontFamily: "Arial, sans-serif", padding: "64px"}}>
      <div style={{width: "52%", display: "flex", flexDirection: "column", justifyContent: "space-between"}}>
        <div style={{display: "flex", alignItems: "center", gap: 16, fontSize: 28, fontWeight: 700}}>
          <div style={{width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 7, color: "#1d1e1b", background: "#f6f7f2"}}>S</div>
          Science Studio
        </div>
        <div style={{display: "flex", flexDirection: "column", gap: 22}}>
          <div style={{color: "#ef6548", fontSize: 19, fontWeight: 700, textTransform: "uppercase"}}>Interactive physics for teachers</div>
          <div style={{fontFamily: "Georgia, serif", fontSize: 61, lineHeight: 1.05, fontWeight: 600}}>Experiments, ready for class.</div>
          <div style={{color: "#bdc1b8", fontSize: 23, lineHeight: 1.4}}>Adjust parameters. Explain step by step. Present on any classroom screen.</div>
        </div>
      </div>
      <div style={{position: "relative", width: "44%", display: "flex", marginLeft: "4%", overflow: "hidden", border: "2px solid #5b5e56", borderRadius: 8, background: "#f6f7f2"}}>
        <div style={{position: "absolute", left: 54, bottom: 88, width: 380, height: 5, background: "#20211e", transform: "rotate(-32deg)", transformOrigin: "left"}} />
        <div style={{position: "absolute", left: 170, bottom: 235, width: 84, height: 68, border: "5px solid #20211e", background: "#f6f7f2", transform: "rotate(-32deg)"}} />
        <div style={{position: "absolute", left: 208, bottom: 264, width: 5, height: 142, background: "#e85d42"}} />
        <div style={{position: "absolute", left: 222, bottom: 382, color: "#e85d42", fontSize: 23, fontWeight: 700}}>Fg</div>
        <div style={{position: "absolute", right: 42, bottom: 95, color: "#2659a8", fontSize: 29, fontWeight: 700}}>32 deg</div>
      </div>
    </div>,
    size,
  );
}
