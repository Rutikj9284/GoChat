import { useContext } from "react";
import { UserContext } from "./UserContext";
import LoginAndRegister from "./LoginAndRegister";
import Chat from "./Chat";

export default function Routes(){
    const {username, id} = useContext(UserContext);

    if(username){
        return <Chat />;
    }
    return (
        <LoginAndRegister />
    )
}