import { useCallback } from "vue-function-component";
import { Input } from "./input";

import { ADD_ITEM } from "../constants";

export function Header({ dispatch }) {
    const addItem = useCallback((title) => {
        dispatch({ type: ADD_ITEM, payload: { title } })
    }, [dispatch]);

    return (
        <header class="header" data-testid="header">
            <h1>todos</h1>
            <Input onSubmit={addItem} label="New Todo Input" placeholder="What needs to be done?" />
        </header>
    );
}