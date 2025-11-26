const AuthLayout = (
    {children}:
    {children : React.ReactNode}
) => {
    return ( 
        <div className="min-h-screen bg-darker-bg flex items-center justify-center p-5">
            {children}
        </div>
    );
}
 
export default AuthLayout;