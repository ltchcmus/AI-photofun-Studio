def validate_request_data(data, schema):
    """
    Validates incoming request data against a given schema.

    Args:
        data (dict): The incoming request data.
        schema (dict): The schema to validate against.

    Returns:
        bool: True if data is valid, False otherwise.
    """
    from jsonschema import validate, ValidationError

    try:
        validate(instance=data, schema=schema)
        return True
    except ValidationError as e:
        return False


def validate_query_params(params, required_params):
    """
    Validates query parameters to ensure required parameters are present.

    Args:
        params (dict): The query parameters.
        required_params (list): A list of required parameter names.

    Returns:
        bool: True if all required parameters are present, False otherwise.
    """
    return all(param in params for param in required_params)