
import MyWorker from "./js/workerJS.js?worker"

console.log(MyWorker);

export function loadFn() {
    const myWorker = new MyWorker()

    console.log(myWorker);

    myWorker.addEventListener("message", (data) => {
        console.log(data);
    })

    myWorker.addEventListener("error", () => {
        console.log('error');
    })

    myWorker.postMessage({
        type: "CELLDATA",
        message: JSON.stringify([])
    })
}