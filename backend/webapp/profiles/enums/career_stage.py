from django.db import models


class CareerStage(models.TextChoices):
  UNIVERSITY_STUDENT = "university_student", "대학생"
  GRADUATE_STUDENT = "graduate_student", "대학원생"
  LESS_THAN_1_YEAR = "lt_1_year", "1년 미만"
  ONE_TO_THREE_YEARS = "1_3_years", "1-3년"
  THREE_TO_SEVEN_YEARS = "3_7_years", "3-7년"
  OVER_SEVEN_YEARS = "over_7_years", "7년 이상"
  OTHER = "other", "기타"
