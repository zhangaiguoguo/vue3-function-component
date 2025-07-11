import {
  useEffect,
  useLayoutEffect,
  useState,
  useReducer,
  useSyncExternalStore,
  useCallback,
  useMemo,
  startTransition,
  useDeferredValue,
  useRef,
} from "react";
import "./App.css";
let arr = [];

function App() {
  const [count, setCount] = useState(0);
  // useLayoutEffect(() => {
  //   console.log("useLayoutEffect");
  // });

  const [state, setState] = useReducer(
    (s, v) => {
      return { ...s };
    },
    { a: 1 }
  );
  useEffect(() => {
    setState({
      type: 1,
      v: 1,
    });
  }, [count]);
  const fns = useMemo(() => [], []);
  const a = useSyncExternalStore(
    useCallback((cb) => {
      fns.push(cb);
      return () => {
        // console.log("destory useSyncExternalStore");
      };
    }, []),
    () => {
      console.log("getSnapshot")
      return arr
    }
  );

  console.log("render");

  // console.log(count%2 ? useDeferredValue(1) : useRef())

  return (
    <>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count} - {a}
        </button>
        <p></p>
        <button
          onClick={() => {
            arr = [...arr];
            fns.forEach((fn) => {
              console.log(fn);
              startTransition(() => {
                fn();
              });
            });
          }}
        >
          set useSyncExternalStore
        </button>
      </div>
    </>
  );
}

export default App;
