<script setup lang="tsx">
import {
  defineFunctionComponent,
  useId,
  useState,
} from "@/vueFunctionComponent";
import { getCurrentInstance, onMounted, onUnmounted, ref } from "vue";

onUnmounted(() => {
  console.log("app destory");
});

onMounted(() => {
  console.log("app mounted");
});

const FilterableProductTable = defineFunctionComponent(
  function FilterableProductTable({ products }) {
    const [filterText, setFilterText] = useState("");
    const [inStockOnly, setInStockOnly] = useState(false);
    console.log(useId());
    // console.log(inStockOnly ? useId() : null)

    return (
      <div>
        <SearchBar
          filterText={filterText}
          inStockOnly={inStockOnly}
          onFilterTextChange={setFilterText}
          onInStockOnlyChange={setInStockOnly}
        />
        <ProductTable
          products={products}
          filterText={filterText}
          inStockOnly={inStockOnly}
        />
      </div>
    );
  }
);

const ProductCategoryRow = defineFunctionComponent(function ProductCategoryRow({
  category,
}) {
  return (
    <tr>
      <th colSpan="2">{category}</th>
    </tr>
  );
});

const ProductRow = defineFunctionComponent(function ProductRow({ product }) {
  const name = product.stocked ? (
    product.name
  ) : (
    <span style={{ color: "red" }}>{product.name}</span>
  );

  return (
    <tr>
      <td>{name}</td>
      <td>{product.price}</td>
    </tr>
  );
});

const ProductTable = defineFunctionComponent(function ProductTable({
  products,
  filterText,
  inStockOnly,
}) {
  const rows = [];
  let lastCategory = null;

  products.forEach((product) => {
    if (product.name.toLowerCase().indexOf(filterText.toLowerCase()) === -1) {
      return;
    }
    if (inStockOnly && !product.stocked) {
      return;
    }
    if (product.category !== lastCategory) {
      rows.push(
        <ProductCategoryRow
          category={product.category}
          key={product.category}
        />
      );
    }
    rows.push(<ProductRow product={product} key={product.name} />);
    lastCategory = product.category;
  });

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
});

const SearchBar = defineFunctionComponent(function SearchBar({
  filterText,
  inStockOnly,
  onFilterTextChange,
  onInStockOnlyChange,
}) {
  return (
    <form>
      <input
        type="text"
        value={filterText}
        placeholder="Search..."
        onChange={(e) => onFilterTextChange(e.target.value)}
      />
      <label>
        <input
          type="checkbox"
          checked={inStockOnly}
          onChange={(e) => onInStockOnlyChange(e.target.checked)}
        />{" "}
        Only show products in stock
      </label>
    </form>
  );
});

const PRODUCTS = [
  { category: "Fruits", price: "$1", stocked: true, name: "Apple" },
  { category: "Fruits", price: "$1", stocked: true, name: "Dragonfruit" },
  { category: "Fruits", price: "$2", stocked: false, name: "Passionfruit" },
  { category: "Vegetables", price: "$2", stocked: true, name: "Spinach" },
  { category: "Vegetables", price: "$4", stocked: false, name: "Pumpkin" },
  { category: "Vegetables", price: "$1", stocked: true, name: "Peas" },
];

const count = ref(0);
</script>
<template>
  <div>
    <div>
      <button @click="count++">count++{{ count }}</button>
    </div>
    <FilterableProductTable :products="PRODUCTS" />;
  </div>
</template>
