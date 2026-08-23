import ApiError from "./api-error.js"

const assertTenant = ({resourceOrganizationId, orgId}: {resourceOrganizationId: string, orgId: string}) => {
    if(resourceOrganizationId !== orgId) {
        throw ApiError.forbidden("Cross-tenant access denied")
    }
}

export {
    assertTenant
}
