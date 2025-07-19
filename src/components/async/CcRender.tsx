import { useContext, useSlots, useState } from "@/vueFunctionComponent";
import { C, C2 } from "../context";
// import { h } from "vue";
// await new Promise((rst) => {
//   setTimeout(rst, 2000);
// });
const CcRedner = (props) => {
  const [count, setCount] = useState(1);
  const value = useContext(C);
  console.log(useContext(C2));
  const slots = useSlots();
  return (
    <div>
      <h1>
        Cc - {props.a} - {value}
      </h1>
      <h1>Cc count - {count}</h1>
      <button onClick={() => setCount((count + 1) * props.a)}>count++</button>
      {slots.default && (slots.default() as any)}
    </div>
  );
};

export default CcRedner;
