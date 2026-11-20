import type { PeopleProfileUpdateCard } from "crisp-api";
import { paginate } from "./pagination.ts";
import { segment } from "./paths.ts";
import { handler, type ToolContext, type ToolHandler } from "./types.ts";

interface Person {
  people_id_or_email: string;
}

function updateProfile(
  { website, websiteId }: ToolContext,
  peopleIdOrEmail: string,
  profile: PeopleProfileUpdateCard,
) {
  return website.updatePeopleProfile(websiteId, segment(peopleIdOrEmail), profile);
}

export const peopleTools: Record<string, ToolHandler> = {
  list_people_profiles_at_page: handler<{ page: number }>(
    async ({ page }, { website, websiteId }) => {
      const { items, pagination } = paginate(
        await website.listPeopleProfiles(websiteId, page),
        page,
      );
      return { people: items, pagination };
    },
  ),

  search_people_profiles: handler<{ search_query: string }>(
    ({ search_query }, { website, websiteId }) =>
      website.listPeopleProfiles(
        websiteId,
        1,
        undefined,
        undefined,
        undefined,
        undefined,
        search_query,
      ),
  ),

  get_people_profile: handler<Person>(({ people_id_or_email }, { website, websiteId }) =>
    website.getPeopleProfile(websiteId, segment(people_id_or_email)),
  ),

  update_people_profile_full_name: handler<Person & { full_name: string }>(
    ({ people_id_or_email, full_name }, ctx) =>
      updateProfile(ctx, people_id_or_email, { person: { nickname: full_name } }),
  ),

  update_people_profile_email: handler<Person & { new_email: string }>(
    ({ people_id_or_email, new_email }, ctx) =>
      updateProfile(ctx, people_id_or_email, { email: new_email }),
  ),

  update_people_profile_phone: handler<Person & { phone: string }>(
    ({ people_id_or_email, phone }, ctx) =>
      updateProfile(ctx, people_id_or_email, { person: { phone } }),
  ),

  update_people_profile_segments: handler<Person & { segments: string[] }>(
    ({ people_id_or_email, segments }, ctx) => updateProfile(ctx, people_id_or_email, { segments }),
  ),

  list_people_conversations: handler<Person>(({ people_id_or_email }, { website, websiteId }) =>
    website.listPeopleConversations(websiteId, segment(people_id_or_email), 1),
  ),
};
