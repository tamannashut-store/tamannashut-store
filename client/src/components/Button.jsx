function Button({
    children,
    onClick,
    className=""
}) {

    return (

        <button

            onClick={onClick}

            className={`
                rounded-xl
                px-6
                py-3
                bg-pink-600
                hover:bg-pink-700
                text-white
                font-semibold
                transition
                duration-300
                ${className}
            `}
        >

            {children}

        </button>

    );

}

export default Button;