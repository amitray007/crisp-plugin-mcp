import { handler, type ToolHandler } from "./types.ts";

export const workspaceTools: Record<string, ToolHandler> = {
  get_website_information: handler((_args, { website, websiteId }) =>
    website.getWebsite(websiteId),
  ),
  get_website_settings: handler((_args, { website, websiteId }) =>
    website.getWebsiteSettings(websiteId),
  ),
  get_availability_status: handler((_args, { website, websiteId }) =>
    website.getWebsiteAvailabilityStatus(websiteId),
  ),
  list_operators: handler((_args, { website, websiteId }) =>
    website.listWebsiteOperators(websiteId),
  ),
  list_operators_active: handler((_args, { website, websiteId }) =>
    website.listLastActiveWebsiteOperators(websiteId),
  ),
  get_visitors_count: handler((_args, { website, websiteId }) => website.countVisitors(websiteId)),
  list_visitors: handler((_args, { website, websiteId }) => website.listVisitors(websiteId, 1)),
  list_inboxes: handler((_args, { website, websiteId }) => website.listInboxes(websiteId, 1)),
};
