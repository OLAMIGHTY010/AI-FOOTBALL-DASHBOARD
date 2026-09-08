import logging
from typing import Callable, List, Dict, Any

logger = logging.getLogger(__name__)

class PipelineError(Exception):
    """Exception raised when a pipeline step fails."""
    def __init__(self, message: str, step_name: str, status_code: int = 400):
        super().__init__(message)
        self.step_name = step_name
        self.status_code = status_code


class Pipeline:
    """
    A lightweight framework for Algorithmic Sequencing.
    Executes a series of atomic steps (functions) in order.
    Passes a shared 'context' dictionary between steps.
    If any step fails (raises PipelineError), the sequence halts immediately.
    """
    def __init__(self, name: str):
        self.name = name
        self.steps: List[Callable[[Dict[str, Any]], None]] = []

    def add_step(self, step_func: Callable[[Dict[str, Any]], None]) -> "Pipeline":
        """Add an atomic operation to the pipeline."""
        self.steps.append(step_func)
        return self

    def execute(self, initial_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Run the pipeline sequentially.
        Returns the final context if successful.
        Raises PipelineError if a step fails.
        """
        context = initial_context or {}
        logger.info(f"Starting pipeline: {self.name}")

        for step in self.steps:
            step_name = step.__name__
            logger.info(f"Executing step: {step_name}")
            try:
                # Each step mutates or reads from the shared context
                step(context)
            except PipelineError as e:
                logger.error(f"Pipeline '{self.name}' failed at step '{step_name}': {e}")
                raise
            except Exception as e:
                logger.error(f"Pipeline '{self.name}' encountered unexpected error at '{step_name}': {e}")
                raise PipelineError(f"Unexpected error: {str(e)}", step_name, status_code=500)

        logger.info(f"Pipeline '{self.name}' completed successfully.")
        return context
