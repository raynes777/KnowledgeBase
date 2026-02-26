package content.visitor;
import content.*;
public interface ContentVisitor<T> {
	T visitStringContent(StringContent c);
	T visitTranscludedContent(TranscludedContent c);
	T visitIntegerContent(IntegerContent c);
}
