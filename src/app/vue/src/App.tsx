import { useEffect, useMemo, useRef, useState } from "vue-function-component";

function A(props: { a: number }) {
  const [count, setCount] = useState(1);
  useEffect(() => {
    console.log(1);
  }, []);
  console.log(useMemo(() => count * 2, [count]));
  return (
    <>
      <h1>{props.a}</h1>
      <button onClick={() => setCount(count + 1)}>点击{count}</button>
    </>
  );
}

export default () => {
  console.log(useState(1));
  return (
    <>
      <h1>App</h1>
      <A a={1} />
      <A a={2} />
    </>
  );
};
