import { defineFunctionComponent, useState } from "@/vueFunctionComponent";

const Cc = defineFunctionComponent(
  {
    loader: () => {
      console.log("xxxx");
      return import("./CcRender");
    },
    loading() {
      return <h1>loading...</h1>;
    },
    error: (props) => {
      return <h1>error - {props.error + ""}</h1>;
    },
  },
  {
    props: ["a", "b"] as const,
    name: "Xxxx",
  }
);

console.dir(Cc);

export default Cc;
