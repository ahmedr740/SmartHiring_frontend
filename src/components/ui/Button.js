function Button({ as: Component = "button", variant = "primary", size = "md", icon: Icon, className = "", children, ...props }) {
    const variants = {
        primary: "bg-brand-600 text-white shadow-card hover:bg-brand-700 disabled:bg-brand-300",
        secondary: "border border-brand-200 bg-white text-brand-700 hover:border-brand-300 hover:bg-brand-50",
        ghost: "text-gray-600 hover:bg-brand-50 hover:text-brand-700",
        accent: "bg-accent-500 text-white shadow-card hover:bg-accent-600",
        danger: "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50",
    };
    const sizes = {
        sm: "min-h-10 px-3.5 py-2 text-sm",
        md: "min-h-11 px-5 py-2.5 text-sm",
        lg: "min-h-12 px-6 py-3 text-base",
    };

    return (
        <Component
            className={`inline-flex items-center justify-center gap-2 rounded-xl font-bold transition focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {Icon && <Icon size={18} strokeWidth={2.2} aria-hidden="true" />}
            {children}
        </Component>
    );
}

export default Button;
