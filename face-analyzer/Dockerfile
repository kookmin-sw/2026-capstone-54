FROM public.ecr.aws/lambda/python:3.12

RUN dnf install -y mesa-libGL mesa-libGLU libXext libSM libXrender && dnf clean all

COPY requirements.txt ${LAMBDA_TASK_ROOT}/
RUN pip install --no-cache-dir -r ${LAMBDA_TASK_ROOT}/requirements.txt

COPY models/ ${LAMBDA_TASK_ROOT}/models/
COPY handler.py ${LAMBDA_TASK_ROOT}/
COPY analyzer/ ${LAMBDA_TASK_ROOT}/analyzer/

CMD ["handler.handler"]
