import { useState, createContext, useContext } from "react";
import "./App.css";

const C = createContext(1);
console.log(C);
console.log(createContext)

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <C.Provider value={2 + count}>
          <C.Provider value={3 + count}>
            <C.Consumer>{Cc}</C.Consumer>
            <B></B>
          </C.Provider>
          <B></B>
        </C.Provider>
      </div>
    </>
  );
}

function B() {
  const value = useContext(C);
  return <h1>b - {value}</h1>;
}

function Cc(value) {
  return (
    <>
      <h1>Cc - {value}</h1>
      <B />
    </>
  );
}

export default App;
