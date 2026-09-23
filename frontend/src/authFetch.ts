export async function authFetch(url: string, options: RequestInit, getToken: () => Promise<string | null>) {
  const token = await getToken()
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    }
  })
}

