package service.communication.mapper;

import org.mapstruct.Mapper;
import service.communication.DTOs.response.GroupMessageResponse;
import service.communication.entity.GroupMessage;

@Mapper(componentModel = "spring")
public interface GroupMessageMapper {
  GroupMessageResponse toGroupMessageResponse(GroupMessage groupMessage);
}
