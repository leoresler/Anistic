import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { ExploreFilterDrawer, ExploreFilters } from "./ExploreFilters";

const noop = () => undefined;

const props = {
  genres: ["Action", "Adventure"],
  years: [2026, 2025],
  params: new URLSearchParams(),
  onSetParam: noop,
  onToggleGenre: noop,
  onClear: noop,
};

describe("ExploreFilters", () => {
  it("renders the format single-select in the desktop filter row", () => {
    const html = renderToStaticMarkup(<ExploreFilters {...props} />);

    assert.match(html, /Formato: Todos/);
    assert.match(html, /Ordenar: Relevancia/);
  });

  it("renders the same format filter inside the mobile drawer", () => {
    const html = renderToStaticMarkup(<ExploreFilterDrawer open onClose={noop} {...props} />);

    assert.match(html, /Formato: Todos/);
    assert.match(html, /Cerrar filtros/);
  });
});
