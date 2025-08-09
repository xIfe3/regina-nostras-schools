import { Helmet } from "react-helmet-async";

export function usePageTitle(title: string) {
    return (
        <Helmet>
            <title>{title} | Regina Nostra Schools </title>
        </Helmet>
    );
}
