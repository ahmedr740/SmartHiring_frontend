function PageHeader({ eyebrow, title, description, actions }) {
    return (
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
                {eyebrow && <p className="jh-eyebrow">{eyebrow}</p>}
                <h2 className="jh-page-title">{title}</h2>
                {description && <p className="jh-page-copy">{description}</p>}
            </div>
            {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
        </div>
    );
}

export default PageHeader;
