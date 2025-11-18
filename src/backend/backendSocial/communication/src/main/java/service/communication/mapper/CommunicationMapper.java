package service.communication.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import service.communication.DTOs.response.GetMessageCoupleResponse;
import service.communication.entity.Communication;

@Mapper(componentModel = "spring")
public interface CommunicationMapper {
    @Mapping(target = "timestamp", ignore = true)
    GetMessageCoupleResponse toGetMessageCoupleResponse(Communication communication);
}
