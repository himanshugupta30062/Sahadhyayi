// src/utils/navigation.ts
function redirectToUserHome(navigate) {
  navigate("/dashboard", { replace: true });
}
export {
  redirectToUserHome
};
