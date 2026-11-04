type AuthFetch = (path: string, options?: RequestInit) => Promise<Response>;

type ProfileFields = {
	display_name: string | null;
	birthday: string | null;
};

export async function createProfile(authFetch: AuthFetch, profile: ProfileFields) {
	const response = await authFetch("/profile/create", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(profile),
	});
	if (!response.ok) throw new Error("Unable to create profile.");
}

export async function updateProfile(authFetch: AuthFetch, profile: Partial<ProfileFields>) {
	const response = await authFetch("/profile/update", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(profile),
	});
	if (!response.ok) throw new Error("Unable to update profile.");
}
 