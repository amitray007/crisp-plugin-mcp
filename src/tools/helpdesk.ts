import type { HelpdeskContentType } from "crisp-api";
import { collectPages } from "./pagination.ts";
import { treePath } from "./paths.ts";
import { handler, type ToolContext, type ToolHandler } from "./types.ts";

interface Section {
  locale: string;
  // The published schema allows only "articles", which equals HelpdeskContentType.Articles.
  section: HelpdeskContentType;
}

type TreeFile = Section & { tree_path: string };

function onTreeFile<Args extends TreeFile, Result>(
  run: (
    ctx: ToolContext,
    file: [string, string, HelpdeskContentType, string],
    args: Args,
  ) => Promise<Result>,
): ToolHandler {
  return handler<Args>((args, ctx) =>
    run(ctx, [ctx.websiteId, args.locale, args.section, treePath(args.tree_path)], args),
  );
}

export const helpdeskTools: Record<string, ToolHandler> = {
  get_helpdesk_information: handler((_args, { website, websiteId }) =>
    website.resolveHelpdesk(websiteId),
  ),

  list_helpdesk_locales: handler(async (_args, { website, websiteId }) => {
    const { items, is_partial_result } = await collectPages((page) =>
      website.listHelpdeskLocales(websiteId, page),
    );
    return { locales: items, is_partial_result };
  }),

  list_helpdesk_pages: handler<Section>(async ({ locale, section }, { website, websiteId }) => {
    const { items, is_partial_result } = await collectPages((page) =>
      website.listHelpdeskPages(websiteId, locale, section, page),
    );
    return { pages: items, is_partial_result };
  }),

  list_helpdesk_tree: handler<Section & { sub_path?: string }>(
    async ({ locale, section, sub_path }, { website, websiteId }) => {
      const subPath = sub_path === undefined ? null : treePath(sub_path);
      const { items, is_partial_result } = await collectPages((page) =>
        website.listHelpdeskTree(websiteId, locale, section, page, subPath),
      );
      return { tree: items, is_partial_result };
    },
  ),

  search_helpdesk_tree: handler<Section & { search_query: string }>(
    async ({ locale, section, search_query }, { website, websiteId }) => {
      const { items, is_partial_result } = await collectPages((page) =>
        website.listHelpdeskTree(websiteId, locale, section, page, null, search_query),
      );
      return { tree: items, is_partial_result };
    },
  ),

  create_helpdesk_tree_path: onTreeFile(({ website }, file) =>
    website.createHelpdeskTreePath(...file),
  ),

  delete_helpdesk_tree_path: onTreeFile(({ website }, file) =>
    website.deleteHelpdeskTreePath(...file),
  ),

  get_helpdesk_tree_path_content: onTreeFile(({ website }, file) =>
    website.resolveHelpdeskTreeContent(...file),
  ),

  update_helpdesk_tree_path_content: onTreeFile<TreeFile & { content: string }, unknown>(
    ({ website }, file, { content }) => website.saveHelpdeskTreeContent(...file, content),
  ),

  get_helpdesk_tree_path_title: onTreeFile(async ({ website }, file) => {
    const { title } = await website.resolveHelpdeskTreeMetadata(...file);
    return { title: title ?? null };
  }),

  update_helpdesk_tree_path_title: onTreeFile<TreeFile & { title: string }, unknown>(
    ({ website }, file, { title }) => website.updateHelpdeskTreeMetadata(...file, { title }),
  ),

  get_helpdesk_tree_path_metadata: onTreeFile(({ website }, file) =>
    website.resolveHelpdeskTreeMetadata(...file),
  ),

  get_helpdesk_settings: handler((_args, { website, websiteId }) =>
    website.resolveHelpdeskSettings(websiteId),
  ),
};
