import { useState, createContext, useContext, memo } from "react";
import "./App.css";

const C = createContext(12222);
console.log(C);
console.log(createContext);

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <C.Provider value={2 + count}>
          <C.Consumer>{Cc}</C.Consumer>
        </C.Provider>
        <B></B>
      </div>
    </>
  );
}

function B() {
  const value = useContext(C);
  return <h1>b - {value}</h1>;
}

console.log(memo(() => 1))

function Cc(value) {
  return (
    <>
      <h1>Cc - {value}</h1>
    </>
  );
}

export default App;
