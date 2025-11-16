package service.communication.mapper;

import org.mapstruct.Mapper;
import service.communication.DTOs.response.GetInforGroupResponse;
import service.communication.entity.Group;

@Mapper(componentModel = "spring")
public interface GroupMapper {

    GetInforGroupResponse toGetInforGroupResponse(Group group);
}
