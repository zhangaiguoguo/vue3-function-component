import { useCallback, useMemo } from "vue-function-component";
import classnames from "classnames";

import { REMOVE_COMPLETED_ITEMS } from "../constants";
import { useLocation } from "../hooks/useLocation";

export function Footer({ todos, dispatch }) {
    const { pathname: route } = useLocation();

    const activeTodos = useMemo(() => todos.filter((todo) => !todo.completed), [todos]);

    const removeCompleted = useCallback(() => dispatch({ type: REMOVE_COMPLETED_ITEMS }), [dispatch]);

    // prettier-ignore
    if (todos.length === 0)
        return null;

    return (
        <footer class="footer" data-testid="footer">
            <span class="todo-count">{`${activeTodos.length} ${activeTodos.length === 1 ? "item" : "items"} left!`}</span>
            <ul class="filters" data-testid="footer-navigation">
                <li>
                    <a class={classnames({ selected: route === "/" })} href="#/">
                        All
                    </a>
                </li>
                <li>
                    <a class={classnames({ selected: route === "/active" })} href="#/active">
                        Active
                    </a>
                </li>
                <li>
                    <a class={classnames({ selected: route === "/completed" })} href="#/completed">
                        Completed
                    </a>
                </li>
            </ul>
            <button class="clear-completed" disabled={activeTodos.length === todos.length} onClick={removeCompleted}>
                Clear completed
            </button>
        </footer>
    );
}