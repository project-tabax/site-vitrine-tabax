import { createElement } from "react";
import { Route, Routes } from "react-router-dom";
import { SiteLayout } from "@/layouts/SiteLayout";
import { CmsPage } from "@/components/CmsPage";
import { pages } from "@/generated/pages";
import { customPages } from "@/pages/registry";

// Ensemble des routes connues (pour l'interception des liens internes).
export const knownRoutes = new Set(pages.map((p) => p.route));

function renderPage(p: (typeof pages)[number]) {
  const Custom = customPages[p.slug];
  if (Custom) return createElement(Custom);
  return (
    <CmsPage slug={p.slug} title={p.title} bodyClass={p.bodyClass} htmlClass={p.htmlClass} />
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        {pages.map((p) => (
          <Route key={p.slug} path={p.route} element={renderPage(p)} />
        ))}
        <Route
          path="*"
          element={<CmsPage slug="__notfound__" title="Page introuvable" />}
        />
      </Route>
    </Routes>
  );
}
