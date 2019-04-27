
export async function ajax(...args) {
  const response = await fetch(...args);

  if (response.ok) {
    return await response.json();
  }

  throw await response.text();
}

