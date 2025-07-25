import { useEffect, useMemo, useRef, useState } from "vue-function-component";
import { App } from "./todo/app";
import "todomvc-app-css/index.css";
import "todomvc-common/base.css";

function A(props: { a: number }) {
  const [count, setCount] = useState(1);
  useEffect(() => {
    console.log(1);
  }, []);
  return (
    <>
      {count % 2 ? (
        <>
          <div>div</div>
          <p>p</p>
        </>
      ) : (
        <>
          <p>p</p>
          <div>div</div>
        </>
      )}
      <h1>
        {props.a} - {useMemo(() => count * 2, [count])}
      </h1>
      <button onClick={() => setCount(count + 1)}>点击++</button>
      <button onClick={() => setCount(count - 1)}>点击--</button>
    </>
  );
}

export default () => {
  return (
    <>
      <A a={1} />
      <App />
    </>
  );
};
