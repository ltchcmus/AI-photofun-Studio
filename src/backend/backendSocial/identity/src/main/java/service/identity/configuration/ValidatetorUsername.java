package service.identity.configuration;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import lombok.experimental.NonFinal;
import org.springframework.beans.factory.annotation.Value;

import java.lang.annotation.Annotation;

public class ValidatetorUsername implements ConstraintValidator<CustomValidatorUsername, String> {

    private int min;
    private int max;
    @NonFinal
    @Value("${config.user-default")
    private String userDefault;

    @Override
    public boolean isValid(String s, ConstraintValidatorContext constraintValidatorContext) {
        int size = s.length();
        return s.equals(userDefault) || (size >= min && size <= max);
    }

    @Override
    public void initialize(CustomValidatorUsername constraintAnnotation) {
        ConstraintValidator.super.initialize(constraintAnnotation);
        this.max = constraintAnnotation.max();
        this.min = constraintAnnotation.min();
    }
}
