export function registerUserRouter(router, userService) {
    router.get('/registration', userService.getRegistrationPage);
    router.post('/registration', userService.registration);
    router.get('/login', userService.getLoginPage);
    router.post('/login', userService.login);
    router.post('/loginWithPhone', userService.loginWithPhone);
    router.post('/logout', userService.logout);
    router.post('/update-chat-id', userService.updateChatId);
    router.post('/get-user-by-tg-chat-id', userService.getUserByTgChatId);

}

