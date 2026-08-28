
export async function request(url, options = {}) {
    const defaultHeaders = {
        "Content-Type": "application/json"
    };
    const response = await fetch(url, {
        credentials: "include",
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
    }
    });
    const data = await response.json();

    return {
        status: response.status,
        data
    };
}