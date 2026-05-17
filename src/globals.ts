let username: string = ""

export function getUsername(): string{
    return username;
}

export function setUsername(newUsername: string): void{
    username = newUsername;
}