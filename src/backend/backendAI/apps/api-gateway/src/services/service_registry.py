from typing import Dict, Any

class ServiceRegistry:
    def __init__(self):
        self.services: Dict[str, Any] = {}

    def register_service(self, name: str, service: Any) -> None:
        """Register a new service."""
        if name in self.services:
            raise ValueError(f"Service '{name}' is already registered.")
        self.services[name] = service

    def get_service(self, name: str) -> Any:
        """Retrieve a registered service."""
        service = self.services.get(name)
        if service is None:
            raise ValueError(f"Service '{name}' is not registered.")
        return service

    def list_services(self) -> Dict[str, Any]:
        """List all registered services."""
        return self.services.copy()