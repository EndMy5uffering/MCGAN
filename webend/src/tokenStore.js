const parameters = new URLSearchParams(window.location.search);

export const hasToken = () => {
    return parameters.has("token");
}

export const getToken = () => {
    const parameters = new URLSearchParams(window.location.search);
    return parameters.get("token");
}

export const hasTokenInStorage = () => {
    if(window.localStorage.getItem("user_token")) return true;
    return false;
}

export const getTokenInStorage = () => {
    return window.localStorage.getItem("user_token");
}