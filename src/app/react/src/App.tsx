import { useEffect, useLayoutEffect, useState,} from "react";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);
  useLayoutEffect(() => {
    console.log("useLayoutEffect");
  });
  useEffect(() => {
    console.log("useEffect");
  });

  return (
    <>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p></p>
      </div>
    </>
  );
}

export default App;
