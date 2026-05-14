import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Button } from "../ui/button";

import React from "react";

const Header = () => {
  return (
    <div className="flex justify-between items-center py-4 px-6 bg-transparent h-3 relative z-10 "> 
      <div>
        <h1 className="text-2xl font-bold">DeepAgent</h1>
      </div>
      <div className="mr-4 ml-2">
        <div>
          <Show when="signed-out">
            <SignInButton >
              <Button className="bg-transparent border border-gray-300 text-gray-700 rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer mr-2">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton>
              <Button className="bg-black text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
                Sign Up
              </Button>
            </SignUpButton>
          </Show>
        </div>
        <div>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>
    </div>
  );
};

export default Header;
