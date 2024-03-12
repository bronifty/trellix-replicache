import { createContext, ReactNode, useContext, useEffect } from "react";
import { useNavigate } from "@remix-run/react";

const AuthContext = createContext<{ userId?: string | null }>({});

export const AuthProvider = ({
  children,
  userId,
}: {
  children: ReactNode;
  userId: string | null;
}) => {
  return (
    <AuthContext.Provider value={{ userId }}>{children}</AuthContext.Provider>
  );
};

export const useEnsureLoggedIn = () => {
  const { userId } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) {
      navigate("/login");
    }
  }, [userId]);
};

export const useLoggedUserId = () => {
  const { userId } = useContext(AuthContext);
  return userId;
};
