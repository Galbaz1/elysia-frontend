import { ProfilesPayload, Profile } from "@/app/types/profiles";
import { host } from "@/app/components/host";
import { vsmFetch } from "@/app/lib/vsmFetch";

export async function getProfiles(): Promise<ProfilesPayload> {
  const startTime = performance.now();
  try {
    const response = await vsmFetch(`${host}/vsm/profiles`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(
        `Error fetching profiles! status: ${response.status} ${response.statusText}`
      );
      return {
        profiles: [],
        error: `Error fetching profiles: ${response.status} ${response.statusText}`,
      };
    }

    const data: Profile[] = await response.json();
    return {
      profiles: data,
    };
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return {
      profiles: [],
      error: "Error fetching profiles",
    };
  } finally {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `profiles/get took ${(performance.now() - startTime).toFixed(2)}ms`
      );
    }
  }
}
