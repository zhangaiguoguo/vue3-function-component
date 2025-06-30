import { defineFunctionComponent, useState } from "@/vueFunctionComponent";

export const A = defineFunctionComponent(
  {
    loader() {
      return new Promise((resolve) => {
        // a;
        setTimeout(() => {
          resolve((props, context) => {
            let count = 1;
            console.log(useState(1));
            console.log(useState(() => 2));
            console.log(useState(() => 3));
            return (
              <div>
                <h1>A - {count * props.a}</h1>
                <B />
              </div>
            );
          });
        }, 0);
      });
    },
    loading: () => <div>Loading A...</div>,
    error(props) {
      console.log(props.error);
      return <div>Error loading A {props.error + ""}</div>;
    },
  },
  {
    name: "A",
    props: {
      a: {},
      b: {},
    },
  }
);
export const B = defineFunctionComponent({
  loader() {
    return new Promise((resolve) => {
      //   a
      setTimeout(() => {
        resolve(() => {
          return (
            <div>
              <h1>B</h1>
            </div>
          );
        });
      }, 1000);
    });
  },
  error() {
    return "error";
  },
  loading() {
    return <div>B loading...</div>;
  },
});
