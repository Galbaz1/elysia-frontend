import { BindProfilePayload, ConversationBinding } from "@/app/types/profiles";
import { host } from "@/app/components/host";
import { vsmFetch } from "@/app/lib/vsmFetch";

export async function bindConversationProfile(
  userId: string,
  conversationId: string,
  profileId: string
): Promise<BindProfilePayload> {
  const startTime = performance.now();
  try {
    const response = await vsmFetch(
      `${host}/vsm/users/${userId}/conversations/${conversationId}/profile/${profileId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Error binding profile! status: ${response.status} ${response.statusText}, error: ${errorText}`
      );
      return {
        error: `Error binding profile: ${response.status} ${response.statusText}`,
      };
    }

    const data: ConversationBinding = await response.json();
    return {
      binding: data,
    };
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return {
      error: "Error binding conversation profile",
    };
  } finally {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `bindConversationProfile took ${(performance.now() - startTime).toFixed(2)}ms`
      );
    }
  }
}
